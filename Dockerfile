
# Use an official Python runtime as a parent image
FROM python:3.6.3
MAINTAINER James <jamisson.s.freitas@accenture.com>

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# update Ubutnu
RUN apt-get update -y

# # install Graphviz
RUN apt-get install -y graphviz graphviz-dev --no-install-recommends
RUN pip install pydot

# Install any needed packages specified in requirements.txt
RUN pip3 install -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["python", "Servico/__main__.py"]