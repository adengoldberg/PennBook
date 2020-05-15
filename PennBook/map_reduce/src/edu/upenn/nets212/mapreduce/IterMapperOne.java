package edu.upenn.nets212.mapreduce;


import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;


public class IterMapperOne extends Mapper<LongWritable, Text, Text, Text> {
	
	public void map (LongWritable key, Text value, Context context) 
			throws IOException, InterruptedException {
		String in = value.toString();
		String[] s1 = in.split("\t");
		String[] s2 = s1[1].split(" list");
		String[] nodes = s2[0].split(" ");
		for (int i = 0; i < nodes.length; i++) {
			String[] tag = nodes[i].split(":");
			context.write(new Text(tag[0]), new Text("flow " + s1[0] + " " + tag[1]));
		}
		String adj = "";
		if (s2.length > 1) {
			adj = s2[1];
		}
		context.write(new Text(s1[0]), new Text("list" + adj));
	}
			
}
