package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.io.Text;

public class FinishReducer extends Reducer<Text, Text, Text, Text> {
	
	public void reduce(Text key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {
		for (Text v : values) {
			context.write(key, v);
		}
	}

}
