using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Woodstop.Api.Migrations
{
    /// <inheritdoc />
    public partial class StandSlugs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Stands",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            // Backfill existing rows before enforcing uniqueness. Slugs stay fixed after this.
            migrationBuilder.Sql("""
                DECLARE @id uniqueidentifier, @name nvarchar(160), @town nvarchar(120), @state nvarchar(2), @demo bit;
                DECLARE @text nvarchar(400), @basis nvarchar(180), @candidate nvarchar(200), @char nchar(1), @position int, @suffix int;
                DECLARE stands_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT Id, Name, Town, State, IsDemo FROM Stands ORDER BY Id;
                OPEN stands_cursor;
                FETCH NEXT FROM stands_cursor INTO @id, @name, @town, @state, @demo;
                WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF @demo = 1 AND RIGHT(@name, 7) = N' — demo' SET @name = LEFT(@name, LEN(@name) - 7);
                    SET @text = LOWER(CONCAT(@name, ' ', @town, ' ', @state));
                    SET @basis = ''; SET @position = 1;
                    WHILE @position <= LEN(@text) AND LEN(@basis) < 180
                    BEGIN
                        SET @char = SUBSTRING(@text, @position, 1);
                        IF UNICODE(@char) BETWEEN 97 AND 122 OR UNICODE(@char) BETWEEN 48 AND 57 SET @basis = @basis + @char;
                        ELSE IF LEN(@basis) > 0 AND RIGHT(@basis, 1) <> '-' SET @basis = @basis + '-';
                        SET @position = @position + 1;
                    END;
                    IF RIGHT(@basis, 1) = '-' SET @basis = LEFT(@basis, LEN(@basis) - 1);
                    IF @basis = '' SET @basis = 'stand';
                    SET @candidate = @basis; SET @suffix = 2;
                    WHILE EXISTS (SELECT 1 FROM Stands WHERE Slug = @candidate AND Id <> @id)
                    BEGIN
                        SET @candidate = CONCAT(@basis, '-', @suffix); SET @suffix = @suffix + 1;
                    END;
                    UPDATE Stands SET Slug = @candidate WHERE Id = @id;
                    FETCH NEXT FROM stands_cursor INTO @id, @name, @town, @state, @demo;
                END;
                CLOSE stands_cursor; DEALLOCATE stands_cursor;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Stands_Slug",
                table: "Stands",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Stands_Slug",
                table: "Stands");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Stands");
        }
    }
}
