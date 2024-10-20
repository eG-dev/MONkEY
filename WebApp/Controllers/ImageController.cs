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

        [HttpGet("{fileName}")]
        [Authorize]
        public async Task<IActionResult> FetchImage(string fileName)
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
            
            var stream = await _blobService.GetFileStreamAsync(fileName);

            if (stream != null)
            {
                return new FileStreamResult(stream, contentType);
            }

            return NotFound();
        }
    }
}
