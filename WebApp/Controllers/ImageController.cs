using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using MONkEY.Data.Services;
using MONkEY.Identity.Services;

namespace MONkEY.WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : Controller
    {
        private readonly IUserService _identityService;
        private readonly IImageService _blobService;

        public ImageController(
            IUserService userService,
            IImageService blobService)
        {
            _identityService = userService ?? throw new ArgumentNullException(nameof(userService));
            _blobService = blobService ?? throw new ArgumentNullException(nameof(blobService));
        }

        [Authorize]
        [HttpGet("{tenantKey}/{fileName}")]
        [ResponseCache(CacheProfileName = "Images")]
        public async Task<IActionResult> FetchImage(string tenantKey, string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return BadRequest();
            }

            var identity = await _identityService.FromPrincipal(HttpContext.User);
            if (identity == null || identity.TenantKey != tenantKey)
            {
                return Forbid();
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
            
            var imagePath = $"{tenantKey}/{fileName}";

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
