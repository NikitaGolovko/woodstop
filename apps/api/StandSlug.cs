using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Woodstop.Api;

public static class StandSlug
{
    public static string Create(Stand stand)
    {
        var name = stand.IsDemo ? Regex.Replace(stand.Name, @"\s*[—–-]\s*demo$", "", RegexOptions.IgnoreCase) : stand.Name;
        var text = $"{name} {stand.Town} {stand.State}".Normalize(NormalizationForm.FormD);
        text = new string(text.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray());
        var slug = Regex.Replace(text.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "stand" : slug[..Math.Min(slug.Length, 180)].TrimEnd('-');
    }
}
