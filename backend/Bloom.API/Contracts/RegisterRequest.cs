using System.ComponentModel.DataAnnotations;

namespace Bloom.API.Contracts;

public sealed record RegisterRequest(
    [Required, StringLength(60, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password,
    [Required] IFormFile Photo);
