namespace Bloom.Application.Interfaces;

public interface IPhotoStorage
{
    string? Save(Stream content);
    void Delete(string fileName);
}
