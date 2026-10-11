using Bloom.Application.Interfaces;
using Bloom.Domain.Models;

namespace Bloom.Application.Services;

public enum RegisterStatus { Created, EmailTaken, InvalidPhoto }

public sealed class RegisterService(IUserRepository users, IPasswordService passwords, IPhotoStorage photos)
{
    public (RegisterStatus Status, User? User) Register(string name, string email, string password, Stream photo)
    {
        email = email.Trim().ToLowerInvariant();
        if (users.FindByEmail(email) is not null) return (RegisterStatus.EmailTaken, null);
        var fileName = photos.Save(photo);
        if (fileName is null) return (RegisterStatus.InvalidPhoto, null);

        var user = new User(Guid.NewGuid(), name.Trim(), email, passwords.Hash(password), fileName);
        if (users.TryAdd(user)) return (RegisterStatus.Created, user);
        photos.Delete(fileName);
        return (RegisterStatus.EmailTaken, null);
    }
}
