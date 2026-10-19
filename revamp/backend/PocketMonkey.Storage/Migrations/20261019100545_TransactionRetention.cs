using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class TransactionRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LedgerMaintenanceStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false),
                    LastAllocatedSequenceNumber = table.Column<long>(type: "INTEGER", nullable: false),
                    RetentionRevision = table.Column<long>(type: "INTEGER", nullable: false),
                    LastCompletedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LedgerMaintenanceStates", x => x.Id);
                    table.CheckConstraint("CK_LedgerMaintenanceStates_Revision", "typeof(RetentionRevision) = 'integer' AND RetentionRevision >= 0");
                    table.CheckConstraint("CK_LedgerMaintenanceStates_Sequence", "typeof(LastAllocatedSequenceNumber) = 'integer' AND LastAllocatedSequenceNumber >= 0");
                    table.CheckConstraint("CK_LedgerMaintenanceStates_Singleton", "Id = 1");
                });

            migrationBuilder.CreateTable(
                name: "RetiredLedgerKeys",
                columns: table => new
                {
                    IdempotencyKey = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    RetiredAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetiredLedgerKeys", x => x.IdempotencyKey);
                    table.CheckConstraint("CK_RetiredLedgerKeys_Key", "length(IdempotencyKey) = 36");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_OccurredAtUtc_SequenceNumber",
                table: "LedgerEntries",
                columns: new[] { "OccurredAtUtc", "SequenceNumber" });

            migrationBuilder.Sql("INSERT INTO LedgerMaintenanceStates (Id, LastAllocatedSequenceNumber, RetentionRevision) SELECT 1, COALESCE(MAX(SequenceNumber), 0), 0 FROM LedgerEntries;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LedgerMaintenanceStates");

            migrationBuilder.DropTable(
                name: "RetiredLedgerKeys");

            migrationBuilder.DropIndex(
                name: "IX_LedgerEntries_OccurredAtUtc_SequenceNumber",
                table: "LedgerEntries");
        }
    }
}
