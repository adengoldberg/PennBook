package edu.upenn.nets212.mapreduce;


import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;


public class IterMapperTwo extends Mapper<LongWritable, Text, Text, Text> {
	
	public void map (LongWritable key, Text value, Context context) 
			throws IOException, InterruptedException {
		String in = value.toString();
		String[] s1 = in.split("\t");
		String[] s2 = s1[1].split(" list");
		String[] labels = s2[0].split(" ");
		String[] neighbors = new String[0];
		String adjList = "";
		if (s2.length > 1) {
			adjList = s2[1];
			neighbors = s2[1].trim().split(" ");
		}
		for (int i = 0; i < labels.length; i++) {
			String[] tag = labels[i].split(":");
			Double tagWeight = Double.parseDouble(tag[1]);
			for(int j = 0; j < neighbors.length; j++) {
				String[] edge = neighbors[j].split(":");
				Double edgeWeight = Double.parseDouble(edge[1]);
				Double out = tagWeight * edgeWeight;
				context.write(new Text(edge[0]), new Text("flow " + 
					tag[0] + " " + out));
			}
		}
		context.write(new Text(s1[0]), new Text("list" + adjList));

		
	}
			
}
