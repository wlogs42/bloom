using Bloom.API.Contracts;
using Bloom.API.Security;
using Bloom.Application.Services;
using Bloom.Application.Interfaces;
using Bloom.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Bloom.API.Controllers;

[ApiController]
[Route("api/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AuthController(LoginService login, RegisterService register, IPersonalStore store, JwtTokenService jwt) : ControllerBase
{
    private const long MaxPhotoBytes = 5 * 1024 * 1024;

    private object Session(User user) => new { user = UserResponse.FromUser(user), token = jwt.Create(user, store.CreateSession(user.Id)) };

    [HttpPost("login")]
    public ActionResult<UserResponse> Login(LoginRequest request)
    {
        var user = login.Login(request.Email, request.Password);
        return user is null
            ? Unauthorized(new { message = "Неправильна пошта або пароль." })
            : Ok(Session(user));
    }

    [HttpPost("register")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxPhotoBytes + 64 * 1024)]
    public ActionResult<UserResponse> Register([FromForm] RegisterRequest request)
    {
        if (request.Name.Trim().Length < 2)
            return BadRequest(new { message = "Ім’я має містити щонайменше 2 символи." });
        if (request.Photo.Length is 0 or > MaxPhotoBytes)
            return BadRequest(new { message = "Додай фото розміром до 5 МБ." });

        using var photo = request.Photo.OpenReadStream();
        var (status, user) = register.Register(request.Name, request.Email, request.Password, photo);
        return status switch
        {
            RegisterStatus.InvalidPhoto => BadRequest(new { message = "Фото має бути у форматі JPEG, PNG або WebP." }),
            RegisterStatus.EmailTaken => Conflict(new { message = "Користувач із такою поштою вже існує." }),
            _ => StatusCode(StatusCodes.Status201Created, Session(user!)),
        };
    }
}
