param([string]$Base, [string]$With, [int]$Thr = 24)
Add-Type -AssemblyName System.Drawing
if (-not ("DustDiff2" -as [type])) {
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class DustDiff2 {
  static byte[] Bytes(Bitmap b, out int stride) {
    var d = b.LockBits(new Rectangle(0,0,b.Width,b.Height), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
    stride = d.Stride; var buf = new byte[d.Stride * b.Height]; Marshal.Copy(d.Scan0, buf, 0, buf.Length); b.UnlockBits(d); return buf;
  }
  public static string Center(string a, string b, int thr) {
    var A = new Bitmap(a); var B = new Bitmap(b); int w = A.Width, h = A.Height, sa, sb;
    var pa = Bytes(A, out sa); var pb = Bytes(B, out sb);
    double sy = 0, sw = 0; int top = h, bot = -1;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int i = y*sa + x*3, j = y*sb + x*3;
      int d = Math.Abs(pa[i]-pb[j]) + Math.Abs(pa[i+1]-pb[j+1]) + Math.Abs(pa[i+2]-pb[j+2]);
      if (d > thr) { sy += (double)y * d; sw += d; if (y < top) top = y; if (y > bot) bot = y; }
    }
    return sw == 0 ? "no-diff" : String.Format("center={0:F1}% top={1:F1}% bottom={2:F1}%", sy/sw/h*100, top*100.0/h, bot*100.0/h);
  }
}
"@
}
[DustDiff2]::Center($Base, $With, $Thr)
