package edu.upenn.nets212.mapreduce;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.Reducer.Context;


public class InitReducer extends Reducer<Text, Text, Text, Text> {
	
	public void reduce(Text key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {
		Double sum = 0.0;
		Map<String, Double> weights = new HashMap<String, Double>();
		for (Text v : values) {
			String connection = v.toString();
			String[] info = connection.split(" ");
			String user = info[0];
			if (weights.containsKey(user)) {
				weights.put(user, weights.get(user) + Double.parseDouble(info[1]));
				sum = sum + Double.parseDouble(info[1]);
			} else {
				weights.put(user, Double.parseDouble(info[1]));
				sum = sum + Double.parseDouble(info[1]);
			}
		}
		String adjList = "";
		for (String u : weights.keySet()) {
			Double w = weights.get(u) / sum;
			adjList = adjList + " " + u + ":" + w;
		}
		context.write(key, new Text(key + ":1.0 list" + adjList));
	}
}