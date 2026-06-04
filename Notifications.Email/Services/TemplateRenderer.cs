using Scriban;
using System.Reflection;

namespace MONkEY.Notifications.Email.Services
{
    public class TemplateRenderer : ITemplateRenderer
    {
        private readonly Dictionary<string, Template> _templateCache = [];

        public async Task<string> RenderAsync(string templateName, object model)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(templateName);
            ArgumentNullException.ThrowIfNull(model);

            var template = GetOrLoadTemplate(templateName);
            var result = await template.RenderAsync(model);

            return result;
        }

        private Template GetOrLoadTemplate(string templateName)
        {
            if (_templateCache.TryGetValue(templateName, out var cachedTemplate))
            {
                return cachedTemplate;
            }

            var templateContent = LoadTemplateContent(templateName);
            var template = Template.Parse(templateContent);

            _templateCache[templateName] = template;

            return template;
        }

        private static string LoadTemplateContent(string templateName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = $"MONkEY.Notifications.Email.Templates.{templateName}.html";

            using Stream stream = assembly.GetManifestResourceStream(resourceName)
                ?? throw new FileNotFoundException($"Template resource not found: {resourceName}");

            using StreamReader reader = new(stream);
            return reader.ReadToEnd();
        }
    }
}
