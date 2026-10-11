using Bloom.Application.Interfaces;
using Bloom.Domain.Models;

namespace Bloom.API.Seed;

public static class UserSeeder
{
    private static readonly (Guid Id, string Name, string Email, string Password)[] Users =
    [
        (Guid.Parse("11111111-1111-1111-1111-111111111111"), "Адміністратор", "admin@gmail.com", "123456"),
        (Guid.Parse("22222222-2222-2222-2222-222222222222"), "Олена", "olena@gmail.com", "olena123"),
        (Guid.Parse("33333333-3333-3333-3333-333333333333"), "Тарас", "taras@gmail.com", "taras123"),
    ];

    public static void Seed(IPersonalStore store, IPasswordService passwords)
    {
        foreach (var (id, name, email, password) in Users)
        {
            if (store.FindById(id) is null && store.FindByEmail(email) is null)
                store.TryAdd(new User(id, name, email, passwords.Hash(password)));
        }
    }
}
