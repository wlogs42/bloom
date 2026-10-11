using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Bloom.API.Contracts;
using Bloom.Application.Interfaces;
using Bloom.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Bloom.API.Controllers;

public sealed record ProfileRequest([Required, StringLength(60, MinimumLength = 2)] string Name, [Required, EmailAddress, StringLength(254)] string Email);
public sealed record PasswordRequest([Required, StringLength(128)] string CurrentPassword, [Required, StringLength(128, MinimumLength = 8)] string NewPassword);
public sealed record TaskRequest([Required, StringLength(100)] string Title, [Required, RegularExpression("^(Робота|Особисте)$")] string Category, [Range(1, 180)] int Minutes, bool Completed = false);
public sealed record TimerRequest([Required, RegularExpression("^(start|pause|reset|duration)$")] string Action, [Range(1, 180)] int? DurationMinutes);

[ApiController, Authorize, Route("api/me")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PersonalController(IPersonalStore store, IPasswordService passwords) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
    private string Token => User.FindFirstValue(JwtRegisteredClaimNames.Jti)!;
    [HttpGet]
    public UserResponse Profile() => UserResponse.FromUser(store.FindById(UserId)!);
    [HttpPut]
    public ActionResult<UserResponse> UpdateProfile(ProfileRequest request)
    {
        if (request.Name.Trim().Length < 2) return BadRequest(new { message = "Вкажи ім’я від 2 символів." });
        var user = store.FindById(UserId)! with { Name = request.Name.Trim(), Email = request.Email.Trim().ToLowerInvariant() };
        return store.UpdateUser(user) ? Ok(UserResponse.FromUser(user)) : Conflict(new { message = "Ця пошта вже використовується." });
    }
    [HttpPut("password")]
    public IActionResult Password(PasswordRequest request)
    {
        if (!passwords.Verify(request.CurrentPassword, store.FindById(UserId)!.PasswordHash)) return StatusCode(403, new { message = "Поточний пароль неправильний." });
        store.ChangePassword(UserId, passwords.Hash(request.NewPassword), Token); return NoContent();
    }
    [HttpPost("logout")]
    public IActionResult Logout() { store.RevokeSession(Token); return NoContent(); }
    [HttpGet("workspace")]
    public Workspace Workspace() => store.ReadWorkspace(UserId);
    [HttpPost("tasks")]
    public Workspace CreateTask(TaskRequest request) => store.UpdateWorkspace(UserId, data =>
        data.Tasks.Add(new BloomTask(Guid.NewGuid(), request.Title.Trim(), request.Category, request.Minutes, false, DateTimeOffset.UtcNow, null)));
    [HttpPut("tasks/{id:guid}")]
    public ActionResult<Workspace> UpdateTask(Guid id, TaskRequest request)
    {
        var found = false;
        var result = store.UpdateWorkspace(UserId, data => {
            var index = data.Tasks.FindIndex(task => task.Id == id);
            if (index < 0) return;
            found = true; var old = data.Tasks[index];
            data.Tasks[index] = old with { Title = request.Title.Trim(), Category = request.Category, Minutes = request.Minutes, Completed = request.Completed, CompletedAt = request.Completed ? old.CompletedAt ?? DateTimeOffset.UtcNow : null };
        });
        return found ? Ok(result) : NotFound();
    }
    [HttpDelete("tasks/{id:guid}")]
    public ActionResult<Workspace> DeleteTask(Guid id)
    {
        var found = false;
        var result = store.UpdateWorkspace(UserId, data => found = data.Tasks.RemoveAll(task => task.Id == id) > 0);
        return found ? Ok(result) : NotFound();
    }
    [HttpPost("timer")]
    public ActionResult<Workspace> Timer(TimerRequest request)
    {
        if (request.Action == "duration" && request.DurationMinutes is null) return BadRequest();
        return store.UpdateWorkspace(UserId, data => {
            var timer = data.Timer;
            switch (request.Action)
            {
                case "start":
                    if (timer.Deadline is not null) break;
                    if (timer.RemainingMs == 0) { timer.RemainingMs = timer.DurationMinutes * 60_000L; timer.RunId = Guid.NewGuid(); }
                    timer.Deadline = data.ServerNow + timer.RemainingMs; break;
                case "pause":
                    if (timer.Deadline is long deadline) timer.RemainingMs = Math.Max(0, deadline - data.ServerNow);
                    timer.Deadline = null; break;
                case "duration":
                case "reset":
                    if (request.Action == "duration") timer.DurationMinutes = request.DurationMinutes!.Value;
                    timer.RemainingMs = timer.DurationMinutes * 60_000L; timer.Deadline = null; timer.RunId = Guid.NewGuid(); break;
            }
        });
    }
}
