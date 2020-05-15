package edu.upenn.nets212.mapreduce;

import java.io.IOException;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.Reducer.Context;

import java.util.ArrayList;
import java.util.List;

public class PreProcessingReducer extends Reducer<Text, Text, Text, Text> {
	
	public void reduce(Text key, Iterable<Text> values, Context context) 
			throws IOException, InterruptedException {

		List<String> users = new ArrayList<String>();
		for (Text person : values) {
			users.add(person.toString());
		}
		for (int i = 0; i < users.size(); i++) {
			for (int j = 0; j < users.size(); j++) {
				String u1 = users.get(i);
				String u2 = users.get(j);
				if (!(u1.equals(u2))) {
					context.write(new Text(u1), new Text(u2 + '\t' + 2));
				}
			}
		}
	}

}
