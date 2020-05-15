package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class DiffMapperTwo extends Mapper<LongWritable, Text, DoubleWritable, Text> {
	
	public void map (LongWritable key, Text value, Context context) 
			throws IOException, InterruptedException {
		String[] s = value.toString().split("\t");
		context.write(new DoubleWritable(Double.parseDouble(s[0]) * -1.0), new Text(""));
	}

}
