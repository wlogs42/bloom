using Bloom.Domain.Models;

namespace Bloom.Application.Interfaces;

public interface IPersonalStore : IUserRepository
{
    User? FindById(Guid id);
    bool UpdateUser(User user);
    string CreateSession(Guid userId);
    User? Authenticate(string token);
    void RevokeSession(string token);
    void ChangePassword(Guid userId, string hash, string currentToken);
    Workspace ReadWorkspace(Guid userId);
    Workspace UpdateWorkspace(Guid userId, Action<Workspace> update);
}
