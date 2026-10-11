using Bloom.Application.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Bloom.Infrastructure.Security;

public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<object> _hasher = new();
    private readonly object _context = new();

    public string Hash(string password) => _hasher.HashPassword(_context, password);

    public bool Verify(string password, string hash) =>
        _hasher.VerifyHashedPassword(_context, hash, password) != PasswordVerificationResult.Failed;
}
