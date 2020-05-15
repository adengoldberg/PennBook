package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class DiffReducerOne extends Reducer<Text, DoubleWritable, DoubleWritable, Text> {
	
	public void reduce(Text key, Iterable<DoubleWritable> values, Context context) 
			throws IOException, InterruptedException {
		
		double change = 1;
		double diff = 0;
		for (DoubleWritable v : values) {
			diff = diff + (v.get() * change);
			change = -1 * change;
		}
		if (change == -1) {
			if (diff < 0.02) { // 0.02 from is cutoff (0.01) + convergence threshold (0.01)
				diff = 0;
			}
		}
		context.write(new DoubleWritable(Math.abs(diff)), new Text(""));
	}

}
