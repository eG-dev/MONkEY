namespace MONkEY.Notifications.Email.Types
{
    public interface ITemplateRenderer
    {
        /// <summary>
        /// Renders a template with the provided model data.
        /// </summary>
        /// <param name="templateName">The name of the template file (without .html extension)</param>
        /// <param name="model">The model object containing data for template substitution</param>
        /// <returns>The rendered template as an HTML string</returns>
        Task<string> RenderAsync(string templateName, object model);
    }
}
