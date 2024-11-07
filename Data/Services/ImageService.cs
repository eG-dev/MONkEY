using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;

namespace MONkEY.Data.Services
{
    public class ImageService : IImageService
    {
        private readonly BlobContainerClient _blobs;

        public ImageService(
            BlobServiceClient blobClient)
        {
             ArgumentNullException.ThrowIfNull(blobClient, nameof(blobClient));

            _blobs = blobClient.GetBlobContainerClient("images");
        }

        public async Task<Stream?> GetFileStreamAsync(string fileName)
        {
            var blockBlockClient = _blobs.GetBlockBlobClient(fileName);
            var response = await blockBlockClient.DownloadStreamingAsync();

            if (response.GetRawResponse().Status == 200)
            {
                return response.Value.Content;
            }

            return null;
        }

        public async Task UploadFileAsync(string fileName, Stream stream)
        {
            await _blobs.UploadBlobAsync(fileName, stream);
        }

        public async Task UploadFileAsync(string fileName, byte[] fileData)
        {
            using var stream = new MemoryStream(fileData);
            await UploadFileAsync(fileName, stream);
        }

        public async Task DeleteFileAsync(string fileName)
        {
            try
            {
                await _blobs.DeleteBlobAsync(fileName);
            }
            catch (RequestFailedException ex)
            {
                if (ex.Status != 404)
                {
                    throw;
                }
            }
        }
    }
}
