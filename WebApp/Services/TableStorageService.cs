using Azure.Data.Tables;

namespace WebApp.Services
{
    public class TableStorageService
    {
        private readonly TableClient _tableClient;

        public TableStorageService(TableClient tableClient)
        {
            _tableClient = tableClient ?? throw new ArgumentNullException(nameof(tableClient));
        }
    }
}
