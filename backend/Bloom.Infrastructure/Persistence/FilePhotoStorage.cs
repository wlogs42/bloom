using Bloom.Application.Interfaces;

namespace Bloom.Infrastructure.Persistence;

public sealed class FilePhotoStorage : IPhotoStorage
{
    private readonly string _directory;

    public FilePhotoStorage(string directory)
    {
        _directory = Path.GetFullPath(directory);
        Directory.CreateDirectory(_directory);
    }

    public string? Save(Stream content)
    {
        var header = new byte[12];
        var read = content.ReadAtLeast(header, header.Length, throwOnEndOfStream: false);
        var extension = Extension(header.AsSpan(0, read));
        if (extension is null) return null;

        var fileName = $"{Guid.NewGuid():N}.{extension}";
        using var file = new FileStream(Path.Combine(_directory, fileName), FileMode.CreateNew);
        file.Write(header, 0, read);
        content.CopyTo(file);
        return fileName;
    }

    public void Delete(string fileName) => File.Delete(Path.Combine(_directory, Path.GetFileName(fileName)));

    private static string? Extension(ReadOnlySpan<byte> header)
    {
        if (header.StartsWith<byte>([0xFF, 0xD8, 0xFF])) return "jpg";
        if (header.StartsWith<byte>([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return "png";
        if (header.Length == 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..].SequenceEqual("WEBP"u8)) return "webp";
        return null;
    }
}
