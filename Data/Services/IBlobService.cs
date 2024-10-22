namespace MONkEY.Data.Services
{
    public interface IBlobService
    {
        Task<Stream?> GetFileStreamAsync(string filename);

        Task UploadFileAsync(string filename, Stream stream);

        Task UploadFileAsync(string filename, byte[] fileData);

        Task DeleteFileAsync(string fileName);
    }
}
