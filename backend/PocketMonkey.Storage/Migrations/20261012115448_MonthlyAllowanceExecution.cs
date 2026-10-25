using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class MonthlyAllowanceExecution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries");

            migrationBuilder.AddColumn<int>(
                name: "AllowanceMonth",
                table: "LedgerEntries",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "AllowanceRevisions",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_AllowanceRevisions_Id",
                table: "AllowanceRevisions",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "AllowanceExecutions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AccountId = table.Column<string>(type: "TEXT", nullable: false),
                    BusinessMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    RevisionId = table.Column<string>(type: "TEXT", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "TEXT", nullable: false),
                    Attempts = table.Column<int>(type: "INTEGER", nullable: false),
                    LastAttemptAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    CreditedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    ErrorCode = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AllowanceExecutions", x => x.Id);
                    table.CheckConstraint("CK_AllowanceExecutions_Attempts", "Attempts >= 0");
                    table.CheckConstraint("CK_AllowanceExecutions_Month", "BusinessMonth BETWEEN 101 AND 999912 AND BusinessMonth % 100 BETWEEN 1 AND 12");
                    table.ForeignKey(
                        name: "FK_AllowanceExecutions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AllowanceExecutions_AllowanceRevisions_RevisionId",
                        column: x => x.RevisionId,
                        principalTable: "AllowanceRevisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_AccountId_AllowanceMonth",
                table: "LedgerEntries",
                columns: new[] { "AccountId", "AllowanceMonth" },
                unique: true,
                filter: "AllowanceMonth IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_AllowanceMonth",
                table: "LedgerEntries",
                sql: "(Source = 'allowance' AND AllowanceMonth IS NOT NULL AND AllowanceMonth BETWEEN 101 AND 999912 AND AllowanceMonth % 100 BETWEEN 1 AND 12) OR (Source <> 'allowance' AND AllowanceMonth IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries",
                sql: "typeof(AmountMinorUnits) = 'integer' AND (Source = 'opening' OR (Source IN ('deposit', 'allowance') AND AmountMinorUnits > 0) OR (Source = 'withdrawal' AND AmountMinorUnits < 0))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries",
                sql: "Source IN ('opening', 'deposit', 'withdrawal', 'allowance')");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceExecutions_AccountId_BusinessMonth",
                table: "AllowanceExecutions",
                columns: new[] { "AccountId", "BusinessMonth" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceExecutions_IdempotencyKey",
                table: "AllowanceExecutions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceExecutions_RevisionId",
                table: "AllowanceExecutions",
                column: "RevisionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AllowanceExecutions");

            migrationBuilder.DropIndex(
                name: "IX_LedgerEntries_AccountId_AllowanceMonth",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_AllowanceMonth",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_AllowanceRevisions_Id",
                table: "AllowanceRevisions");

            migrationBuilder.DropColumn(
                name: "AllowanceMonth",
                table: "LedgerEntries");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "AllowanceRevisions",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Amount",
                table: "LedgerEntries",
                sql: "typeof(AmountMinorUnits) = 'integer' AND (Source = 'opening' OR (Source = 'deposit' AND AmountMinorUnits > 0) OR (Source = 'withdrawal' AND AmountMinorUnits < 0))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_LedgerEntries_Source",
                table: "LedgerEntries",
                sql: "Source IN ('opening', 'deposit', 'withdrawal')");
        }
    }
}
