using Bloom.Domain.Models;

namespace Bloom.Application.Interfaces;

public interface IUserRepository
{
    User? FindByEmail(string email);
    bool TryAdd(User user);
}
