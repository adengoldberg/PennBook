package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class FinishMapper extends Mapper<LongWritable, Text, Text, Text> {
	
	public void map (LongWritable key, Text value, Context context) 
			throws IOException, InterruptedException {
		String[] s1 = value.toString().split("\t");
		String[] s2 = s1[1].split(" list");
		String[] labels = s2[0].split(" ");
		for (int i = 0; i < labels.length; i++) {
			String[] info = labels[i].split(":");
			context.write(new Text(s1[0]), new Text(info[0] + " " + info[1]));
		}
	}

}
