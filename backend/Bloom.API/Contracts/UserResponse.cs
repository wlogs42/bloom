using Bloom.Domain.Models;

namespace Bloom.API.Contracts;

public sealed record UserResponse(Guid Id, string Name, string Email, string? Photo)
{
    public const string PhotoPath = "/uploads";

    public static UserResponse FromUser(User user) =>
        new(user.Id, user.Name, user.Email, user.Photo is null ? null : $"{PhotoPath}/{user.Photo}");
}
