using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;

namespace MONkEY.Data.Services
{
    public class BlobService : IBlobService
    {
        private readonly BlobContainerClient _blobClient;

        public BlobService(BlobContainerClient blobClient)
        {
            _blobClient = blobClient ?? throw new ArgumentNullException(nameof(blobClient));
        }

        public async Task<Stream?> GetFileStreamAsync(string fileName)
        {
            var blockBlockClient = _blobClient.GetBlockBlobClient(fileName);
            var response = await blockBlockClient.DownloadStreamingAsync();

            if (response.GetRawResponse().Status == 200)
            {
                return response.Value.Content;
            }

            return null;
        }

        public async Task UploadFileAsync(string fileName, Stream stream)
        {
            await _blobClient.UploadBlobAsync(fileName, stream);
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
                await _blobClient.DeleteBlobAsync(fileName);
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
