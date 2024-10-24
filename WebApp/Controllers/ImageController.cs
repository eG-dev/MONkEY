using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using MONkEY.Data.Services;

namespace MONkEY.WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : Controller
    {
        private readonly IBlobService _blobService;

        public ImageController(IBlobService blobService)
        {
            _blobService = blobService ?? throw new ArgumentNullException(nameof(blobService));
        }

        [HttpGet("{tenantId}/{fileName}")]
        [Authorize]
        public async Task<IActionResult> FetchImage(string tenant, string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return BadRequest();
            }

            string contentType;
            switch (Path.GetExtension(fileName).ToLower())
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
            
            var imagePath = $"{tenant}/{fileName}";

            try
            {
                var stream = await _blobService.GetFileStreamAsync(imagePath);

                return new FileStreamResult(stream!, contentType);
            }
            catch (RequestFailedException)
            {
                return NotFound();
            }
        }
    }
}
