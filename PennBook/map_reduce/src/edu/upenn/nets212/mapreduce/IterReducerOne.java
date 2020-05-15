package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class IterReducerOne extends Reducer<Text, Text, Text, Text> {
	
	public void reduce(Text key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {

		String weights = "";
		String adj = "";
		for (Text v : values) {
			String[] s = v.toString().split(" ");
			System.out.println(s);
			if (s[0].equals("flow")) {
				System.out.println(s[1]);
				System.out.println(s[2]);
				weights = weights + s[1] + ":" + s[2] + " ";
			} else {
				adj = v.toString();
			}
		}
		context.write(key, new Text(weights + adj));
		
	}

}
