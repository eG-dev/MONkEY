namespace MONkEY.Data.Services
{
    public interface IImageService
    {
        Task<Stream?> GetFileStreamAsync(string fileName);

        Task UploadFileAsync(string fileName, Stream stream);

        Task UploadFileAsync(string fileName, byte[] fileData);

        Task DeleteFileAsync(string fileName);
    }
}
