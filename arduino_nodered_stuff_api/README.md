# Arduino stuff
First you want to copy paste the code in the ``arduino.ino`` file into the Arduino IDE. Then you want to make you have selected the right arduino, should just be the one you have plugged in. Then you want to verify the code and deploy.

To see data in the arduino IDE log, click the ``Serial monitor`` top right (magnifying glass looking button). 
This should bring up the log, which should display the temperature every 3 seconds, example: 23.50
I wasn't able to see if I can get the data  into NodeRED, but this grok conversation goes into it: [Grok](https://grok.com/share/bGVnYWN5LWNvcHk%3D_68f3c84e-5811-435f-a566-65ff4bb764e8)

# NodeRED
The ``nodered.json`` is imported to NodeRED as a json, just copy and paste it in the import thingy, then deploy. At the moment this serves as a simulation with 3 different cases: Occupied (blue), occupied by person(red), available(green).
The function named ``Simulate random input`` in NodeRED has the three different cases mentioned, which is processed in ``Determine seat status``, which then sends a json response with all necessary data for the frontend. This API is available at ```http://localhost:1880/api/seat```. 

# Frontend
``npm i`` to make sure all the necessary packages are installed, just your usual React stuff. ``npm run dev`` to run the application. 


## Other
If temperature says 0.0, its likely that the cables are touching eachother(?) on the back of the temp sensor, make sure this doesn't happen. 

The ranges for whats a person, object and whatnot regarding temp. and weight will need to be re-evaluated and looked more at, what is currently there is just for proof of concept and something to display. 