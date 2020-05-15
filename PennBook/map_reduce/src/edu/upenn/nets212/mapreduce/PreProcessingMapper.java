package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class PreProcessingMapper extends Mapper<LongWritable, Text, Text, Text> {
	
	public void map (LongWritable key, Text value, Context context) 
			throws IOException, InterruptedException {
		String in = value.toString();
		String[] s = in.split("\t");
		context.write(new Text(s[0]), new Text(s[1]));
	}

}
