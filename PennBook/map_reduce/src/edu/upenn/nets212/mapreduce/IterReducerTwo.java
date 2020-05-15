package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class IterReducerTwo extends Reducer<Text, Text, Text, Text> {
	
	public void reduce(Text key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {
		
		Map<String, Double> ranks = new HashMap<String, Double>();
		Collection<String> outgoing = new ArrayList<String>();
		String adjList = "";
		String nodeString = "";
		for (Text v : values) {
			String[] s = v.toString().split(" ");
			if (s[0].equals("flow")) {
				if (ranks.containsKey(s[1])) {
					ranks.put(s[1], ranks.get(s[1]) + Double.parseDouble(s[2]));
				} else {
					ranks.put(s[1], Double.parseDouble(s[2]));
				}
			} else if (s[0].equals("list")) {
				if (s.length > 1) {
					adjList = v.toString().substring(4);
				}
			} else {
				System.out.println("SOMETHING WENT VERY WRONG HERE IN ITER REDUCER");
			}
		}
		ranks.put(key.toString(), 1.0);
		Double sum = 0.0;
		for (String label : ranks.keySet()) {
			if (ranks.get(label) >= 0.01) { // THIS CONSTANT IS CUTOFF POINT, CAN BE CHANGED
				sum = sum + ranks.get(label);
				outgoing.add(label);
			}
		}
		for (String node : outgoing) {
			Double outWeight = ranks.get(node) / sum;
			nodeString = nodeString + node + ":" + outWeight + " ";
		}
		context.write(key, new Text(nodeString + "list" + adjList));
	}

}
