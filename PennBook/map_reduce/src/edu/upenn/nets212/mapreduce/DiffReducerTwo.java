package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class DiffReducerTwo extends Reducer<DoubleWritable, Text, DoubleWritable, Text> {
	
	public void reduce(DoubleWritable key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {
		context.write(new DoubleWritable(key.get() * -1.0), new Text(""));
	}

}
