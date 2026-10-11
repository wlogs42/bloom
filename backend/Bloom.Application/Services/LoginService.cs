using Bloom.Application.Interfaces;
using Bloom.Domain.Models;

namespace Bloom.Application.Services;

public sealed class LoginService(IUserRepository users, IPasswordService passwords)
{
    public User? Login(string email, string password)
    {
        var user = users.FindByEmail(email.Trim());
        return user is not null && passwords.Verify(password, user.PasswordHash) ? user : null;
    }
}
