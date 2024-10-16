using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MONkEY.WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : Controller
    {
        private readonly BlobContainerClient _blobs;

        public ImageController(BlobContainerClient blobClient)
        {
            _blobs = blobClient ?? throw new ArgumentNullException(nameof(blobClient));
        }

        [HttpGet("{filename}")]
        [Authorize]
        public async Task<IActionResult> GetImage(string filename)
        {
            if (string.IsNullOrEmpty(filename))
            {
                return BadRequest();
            }

            string contentType;
            switch (Path.GetExtension(filename).ToLower())
            {
                case ".png":
                    contentType = "image/png";
                    break;

                case ".jpeg":
                case ".jpg":
                    contentType = "image/jpeg";
                    break;

                default:
                    return BadRequest();
            }
            
            var blockBlockClient = _blobs.GetBlockBlobClient(filename);
            var response = await blockBlockClient.DownloadStreamingAsync();

            if (response.GetRawResponse().Status == 200)
            {
                return new FileStreamResult(response.Value.Content, contentType);
            }

            return NotFound();
        }
    }
}
