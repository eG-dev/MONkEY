using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class LedgerUtcDateTimeMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TEMP TABLE LedgerUtcDateTimeValidation (
                    Valid INTEGER NOT NULL CONSTRAINT
                    "LedgerUtcDateTimeMapping: unsupported UTC timestamp; repair ledger data before retrying"
                    CHECK (Valid = 1)
                );
                WITH timestamps AS (
                    SELECT OccurredAtUtc,
                        CASE
                            WHEN substr(OccurredAtUtc, -6) = '+00:00' THEN substr(OccurredAtUtc, 1, length(OccurredAtUtc) - 6)
                            WHEN substr(OccurredAtUtc, -1) = 'Z' THEN substr(OccurredAtUtc, 1, length(OccurredAtUtc) - 1)
                        END AS value
                    FROM LedgerEntries
                )
                INSERT INTO LedgerUtcDateTimeValidation (Valid)
                SELECT 0 WHERE EXISTS (
                    SELECT 1 FROM timestamps WHERE value IS NULL OR NOT (
                        typeof(OccurredAtUtc) = 'text'
                        AND length(CAST(OccurredAtUtc AS BLOB)) = length(OccurredAtUtc)
                        AND substr(value, 1, 19) GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][ T][0-9][0-9]:[0-9][0-9]:[0-9][0-9]'
                        AND (length(value) = 19 OR (
                            length(value) BETWEEN 21 AND 27 AND substr(value, 20, 1) = '.'
                            AND substr(value, 21) NOT GLOB '*[^0-9]*'))
                        AND CAST(substr(value, 1, 4) AS INTEGER) BETWEEN 1 AND 9999
                        AND CAST(substr(value, 6, 2) AS INTEGER) BETWEEN 1 AND 12
                        AND CAST(substr(value, 9, 2) AS INTEGER) BETWEEN 1 AND CASE
                            WHEN CAST(substr(value, 6, 2) AS INTEGER) = 2 THEN
                                CASE WHEN CAST(substr(value, 1, 4) AS INTEGER) % 4 = 0
                                    AND (CAST(substr(value, 1, 4) AS INTEGER) % 100 <> 0
                                        OR CAST(substr(value, 1, 4) AS INTEGER) % 400 = 0)
                                    THEN 29 ELSE 28 END
                            WHEN CAST(substr(value, 6, 2) AS INTEGER) IN (4, 6, 9, 11) THEN 30
                            ELSE 31 END
                        AND CAST(substr(value, 12, 2) AS INTEGER) BETWEEN 0 AND 23
                        AND CAST(substr(value, 15, 2) AS INTEGER) BETWEEN 0 AND 59
                        AND CAST(substr(value, 18, 2) AS INTEGER) BETWEEN 0 AND 59
                    )
                );
                DROP TABLE LedgerUtcDateTimeValidation;
                WITH timestamps AS (
                    SELECT Id, CASE WHEN substr(OccurredAtUtc, -6) = '+00:00'
                        THEN substr(OccurredAtUtc, 1, length(OccurredAtUtc) - 6)
                        ELSE substr(OccurredAtUtc, 1, length(OccurredAtUtc) - 1) END AS value
                    FROM LedgerEntries
                )
                UPDATE LedgerEntries SET OccurredAtUtc = (
                    SELECT replace(substr(value, 1, 19) || CASE WHEN length(value) > 19
                        THEN rtrim(rtrim(substr(value, 20), '0'), '.') ELSE '' END, 'T', ' ')
                    FROM timestamps WHERE timestamps.Id = LedgerEntries.Id
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE LedgerEntries SET OccurredAtUtc = OccurredAtUtc || '+00:00';");
        }
    }
}
