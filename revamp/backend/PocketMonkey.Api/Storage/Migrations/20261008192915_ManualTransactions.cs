using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Api.Storage.Migrations
{
    /// <inheritdoc />
    public partial class ManualTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE LedgerEntries ADD COLUMN SequenceNumber INTEGER NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("WITH ordered AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY OccurredAtUtc, Id) AS Position FROM LedgerEntries) UPDATE LedgerEntries SET SequenceNumber = (SELECT Position FROM ordered WHERE ordered.Id = LedgerEntries.Id);");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_AccountId_SequenceNumber",
                table: "LedgerEntries",
                columns: new[] { "AccountId", "SequenceNumber" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_SequenceNumber",
                table: "LedgerEntries",
                column: "SequenceNumber",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries",
                sql: "typeof(AmountMinorUnits) = 'integer' AND (Source = 'opening' OR (Source = 'deposit' AND AmountMinorUnits > 0) OR (Source = 'withdrawal' AND AmountMinorUnits < 0))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Sequence",
                table: "LedgerEntries",
                sql: "typeof(SequenceNumber) = 'integer' AND SequenceNumber > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries",
                sql: "Source IN ('opening', 'deposit', 'withdrawal')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts",
                sql: "BalanceMinorUnits IS NULL OR typeof(BalanceMinorUnits) = 'integer'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LedgerEntries_AccountId_SequenceNumber",
                table: "LedgerEntries");

            migrationBuilder.DropIndex(
                name: "IX_LedgerEntries_SequenceNumber",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Sequence",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "SequenceNumber",
                table: "LedgerEntries");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries",
                sql: "typeof(AmountMinorUnits) = 'integer' AND AmountMinorUnits >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries",
                sql: "Source = 'opening'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts",
                sql: "BalanceMinorUnits IS NULL OR (typeof(BalanceMinorUnits) = 'integer' AND BalanceMinorUnits >= 0)");
        }
    }
}
