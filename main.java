import java.awt.Desktop;
import java.io.*;

class Main {
	public static void main(String[] args) {
		try {
			// constructor of file class having file as argument
			File file = new File("C:\\Users\\105297006\\Desktop\\GameOfLife\\GameOfLifeFrontEndTest\\dist\\index.html");
			if (!Desktop.isDesktopSupported())// check if Desktop is supported by Platform or not
			{
				System.out.println("not supported");
				return;
			}
			Desktop desktop = Desktop.getDesktop();
			if (file.exists()) // checks file exists or not
				desktop.open(file); // opens the specified file
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}