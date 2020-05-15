package edu.upenn.nets212.mapreduce;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.util.ArrayList;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

/*

To use composite you need 2 input folders. Make sure you put the interests and affiliations
data in input folder 1, and the friendships data in input folder 2. This is necessary because
we do pre-processing on the interests and affiliations data before we send both to the init stage.

*/

public class AdsorptionDriver {
  public static void main(String[] args) throws Exception {
	  
	  System.out.println("name: Aden Goldberg");
	  System.out.println("penn id: adengold");  
		  
	  if (args[0].equals("pre")) {
	      
		  if (args.length != 4) {
	    	  System.err.println("Usage: init <inputDir> <outputDir> <#reducers>");
	          System.exit(-1);
	      }
	      
	      pre(args[1], args[2], Integer.parseInt(args[3]));
		  
	  }
	  if (args[0].equals("init")) {
	      
		  if (args.length != 5) {
	    	  System.err.println("Usage: init <inputDir1> <inputDir2> <outputDir> <#reducers>");
	          System.exit(-1);
	      }
	      
	      init(args[1], args[2], args[3], Integer.parseInt(args[4]));
		  
	  } else if (args[0].equals("iter")) {
		  
		  if (args.length != 4) {
	    	  System.err.println("Usage: iter <inputDir> <outputDir> <#reducers>");
	          System.exit(-1);
	      }
	      iter(args[1], args[2], Integer.parseInt(args[3]));
	      
	  } else if (args[0].equals("diff")) {

		  if (args.length != 5) {
	    	  System.err.println("Usage: diff <inputDir1> <inputDir2> <outputDir> <#reducers>");
	          System.exit(-1);
	      }
	      diff(args[1], args[2], args[3], Integer.parseInt(args[4]));
	      
	  } else if (args[0].equals("finish")) {

		  if (args.length != 4) {
	    	  System.err.println("Usage: finish <inputDir> <outputDir> <#reducers>");
	          System.exit(-1);
	      }
	      finish(args[1], args[2], Integer.parseInt(args[3]));
	      
	  } else if (args[0].equals("composite")) {

		  if (args.length != 8) {
	    	  System.err.println("Usage: composite <inputDir1> <inputDir2> <outputDir> <intermDir1> <intermDir2> <diffDir> <#reducers>");
	          System.exit(-1);
	      }
	      composite(args[1], args[2], args[3], args[4], 
	    		  args[5], args[6], Integer.parseInt(args[7]));
	      
		  
	  } else {
		  System.out.println("INVALID JOB REQUEST");
	  }
  }
  
  private static void pre(String inputDir, String outputDir, int numRed) throws Exception {
	  Job preJob = new Job();
      preJob.setJarByClass(AdsorptionDriver.class);
      
      AdsorptionDriver.deleteDirectory(outputDir);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(preJob, new Path(inputDir));
	  FileOutputFormat.setOutputPath(preJob, new Path(outputDir));
	  
	  // Set the Mapper and Reducer classes
	  preJob.setMapperClass(PreProcessingMapper.class);
	  preJob.setReducerClass(PreProcessingReducer.class);
	  
	  // Set the output types of the Mapper class
	  preJob.setMapOutputKeyClass(Text.class);
	  preJob.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  preJob.setOutputKeyClass(Text.class);
	  preJob.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  preJob.setNumReduceTasks(numRed);

	  preJob.waitForCompletion(true);
  }

  private static void init(String inputDir1, String inputDir2, String outputDir, int numRed) throws Exception {
	  Job initJob = new Job();
      initJob.setJarByClass(AdsorptionDriver.class);
      
      AdsorptionDriver.deleteDirectory(outputDir);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(initJob, new Path(inputDir1));
	  FileInputFormat.addInputPath(initJob, new Path(inputDir2));
	  FileOutputFormat.setOutputPath(initJob, new Path(outputDir));
	  
	  // Set the Mapper and Reducer classes
	  initJob.setMapperClass(InitMapper.class);
	  initJob.setReducerClass(InitReducer.class);
	  
	  // Set the output types of the Mapper class
	  initJob.setMapOutputKeyClass(Text.class);
	  initJob.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  initJob.setOutputKeyClass(Text.class);
	  initJob.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  initJob.setNumReduceTasks(numRed);

	  initJob.waitForCompletion(true);
  }
  
  private static void iter(String inputDir, String outputDir, int numRed) throws Exception {

	  Job iterJob1 = new Job();
      iterJob1.setJarByClass(AdsorptionDriver.class);
      
      AdsorptionDriver.deleteDirectory("inter7329");
      AdsorptionDriver.deleteDirectory(outputDir);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(iterJob1, new Path(inputDir));
	  FileOutputFormat.setOutputPath(iterJob1, new Path("inter7329"));
	  
	  // Set the Mapper and Reducer classes
	  iterJob1.setMapperClass(IterMapperOne.class);
	  iterJob1.setReducerClass(IterReducerOne.class);
	  
	  // Set the output types of the Mapper class
	  iterJob1.setMapOutputKeyClass(Text.class);
	  iterJob1.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  iterJob1.setOutputKeyClass(Text.class);
	  iterJob1.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  iterJob1.setNumReduceTasks(numRed);

	  iterJob1.waitForCompletion(true);

	  Job iterJob2 = new Job();
      iterJob2.setJarByClass(AdsorptionDriver.class);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(iterJob2, new Path("inter7329"));
	  FileOutputFormat.setOutputPath(iterJob2, new Path(outputDir));
	  
	  // Set the Mapper and Reducer classes
	  iterJob2.setMapperClass(IterMapperTwo.class);
	  iterJob2.setReducerClass(IterReducerTwo.class);
	  
	  // Set the output types of the Mapper class
	  iterJob2.setMapOutputKeyClass(Text.class);
	  iterJob2.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  iterJob2.setOutputKeyClass(Text.class);
	  iterJob2.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  iterJob2.setNumReduceTasks(numRed);

	  iterJob2.waitForCompletion(true);
  }
  
  private static void diff(String inputDir1, String inputDir2, String outputDir, int numRed) throws Exception {
	  
	  Job diffJob1 = new Job();
      diffJob1.setJarByClass(AdsorptionDriver.class);
      
      AdsorptionDriver.deleteDirectory("inter8134");
      AdsorptionDriver.deleteDirectory(outputDir);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(diffJob1, new Path(inputDir1));
	  FileInputFormat.addInputPath(diffJob1, new Path(inputDir2));
	  FileOutputFormat.setOutputPath(diffJob1, new Path("inter8134"));
	  
	  // Set the Mapper and Reducer classes
	  diffJob1.setMapperClass(DiffMapperOne.class);
	  diffJob1.setReducerClass(DiffReducerOne.class);
	  
	  // Set the output types of the Mapper class
	  diffJob1.setMapOutputKeyClass(Text.class);
	  diffJob1.setMapOutputValueClass(DoubleWritable.class);
	  
	  // Set the output types of the Reducer class
	  diffJob1.setOutputKeyClass(DoubleWritable.class);
	  diffJob1.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  diffJob1.setNumReduceTasks(numRed);

	  diffJob1.waitForCompletion(true);
	  
	  Job diffJob2 = new Job();
      diffJob2.setJarByClass(AdsorptionDriver.class);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(diffJob2, new Path("inter8134"));
	  FileOutputFormat.setOutputPath(diffJob2, new Path(outputDir));
	  
	  // Set the Mapper and Reducer classes
	  diffJob2.setMapperClass(DiffMapperTwo.class);
	  diffJob2.setReducerClass(DiffReducerTwo.class);
	  
	  // Set the output types of the Mapper class
	  diffJob2.setMapOutputKeyClass(DoubleWritable.class);
	  diffJob2.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  diffJob2.setOutputKeyClass(DoubleWritable.class);
	  diffJob2.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  diffJob2.setNumReduceTasks(1);

	  diffJob2.waitForCompletion(true);
	  
  }
  
  private static void finish(String inputDir, String outputDir, int numRed) throws Exception {
	  
	  Job finishJob = new Job();
      finishJob.setJarByClass(AdsorptionDriver.class);
      
      AdsorptionDriver.deleteDirectory(outputDir);
      
      // Set the paths to the input and output directory
	  FileInputFormat.addInputPath(finishJob, new Path(inputDir));
	  FileOutputFormat.setOutputPath(finishJob, new Path(outputDir));
	  
	  // Set the Mapper and Reducer classes
	  finishJob.setMapperClass(FinishMapper.class);
	  finishJob.setReducerClass(FinishReducer.class);
	  
	  // Set the output types of the Mapper class
	  finishJob.setMapOutputKeyClass(Text.class);
	  finishJob.setMapOutputValueClass(Text.class);
	  
	  // Set the output types of the Reducer class
	  finishJob.setOutputKeyClass(Text.class);
	  finishJob.setOutputValueClass(Text.class);
	  
	  // Set the number of reducers
	  finishJob.setNumReduceTasks(numRed);

	  finishJob.waitForCompletion(true);
	  
  }
  
  private static void composite(String inputDir1, String inputDir2, String outputDir, 
		  String intermDir1, String intermDir2, 
		  String diffDir, int numRed) throws Exception {

  	  pre(inputDir1, intermDir1, numRed);
	  init(inputDir2, intermDir1, intermDir2, numRed);
	  // change this to change diff target
	  double diffTarget = 0.01;
	  double currDiff = Double.MAX_VALUE;
	  while (currDiff > diffTarget) {
		  iter(intermDir2, intermDir1, numRed);
		  iter(intermDir1, intermDir2, numRed);
		  diff(intermDir1, intermDir2, diffDir, numRed);
		  currDiff = readDiffResult(diffDir);
	  }
	  finish(intermDir2, outputDir, numRed);
  }
 
  // Given an output folder, returns the first double from the first part-r-00000 file
  static double readDiffResult(String path) throws Exception 
  {
    double diffnum = 0.0;
    Path diffpath = new Path(path);
    Configuration conf = new Configuration();
    FileSystem fs = FileSystem.get(URI.create(path),conf);
    
    if (fs.exists(diffpath)) {
      FileStatus[] ls = fs.listStatus(diffpath);
      for (FileStatus file : ls) {
	if (file.getPath().getName().startsWith("part-r-00000")) {
	  FSDataInputStream diffin = fs.open(file.getPath());
	  BufferedReader d = new BufferedReader(new InputStreamReader(diffin));
	  String diffcontent = d.readLine();
	  String[] s = diffcontent.split("\t");
	  diffnum = Double.parseDouble(s[0]);
	  d.close();
	}
      }
    }
    
    fs.close();
    return diffnum;
  }

  static void deleteDirectory(String path) throws Exception {
    Path todelete = new Path(path);
    Configuration conf = new Configuration();
    FileSystem fs = FileSystem.get(URI.create(path),conf);
    
    if (fs.exists(todelete)) 
      fs.delete(todelete, true);
      
    fs.close();
  }

}
