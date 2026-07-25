export default function handleCounsellorSockets(socket, connectedCounsellors) {
  socket.on('counsellor-login', (data) => {
    const { counsellorId, role, name } = data;
    connectedCounsellors.set(counsellorId, {
      socketId: socket.id,
      role,
      name,
      online: true,
      idle: false,
      lastActivity: new Date(),
    });
    // undefined
  });

  socket.on('activity_status', (data) => {
       

    const { counsellorId, status, role, name, timestamp=new Date() } = data;
    const counsellor = connectedCounsellors.get(counsellorId);
    if (counsellor) {
      counsellor.idle = status === 'idle';
      counsellor.lastActivity = new Date(timestamp || new Date());
      connectedCounsellors.set(counsellorId, counsellor);

      if (status === 'idle') {
        notifySupervisorsOfIdleCounsellor(counsellorId, counsellor.name);
      }
    } else {
    }
  });
   socket.on('counsellor-break', (data) => {
    const { counsellorId, name } = data;
    notifySupervisorsOfbreakCounsellor(counsellorId, name);
  });


  function notifySupervisorsOfIdleCounsellor(counsellorId, counsellorName) {

    let supervisorCount = 0;
    let notifiedCount = 0;

    for (const [id, userData] of connectedCounsellors.entries()) {
      if (userData.role === 'Supervisor') {
        supervisorCount++;
        const supervisorSocket = global.io.sockets.sockets.get(userData.socketId);


        if (supervisorSocket) {
          try {
            const notificationData = {
              type: 'counsellor_idle',
              message: `${counsellorName} has been idle for 1 minute`,
              counsellorId,
              counsellorName,
              timestamp: new Date().toISOString(),
            };


            supervisorSocket.emit('idle_notification', notificationData);
            notifiedCount++;

          } catch (error) {
          }
        } else {
          connectedCounsellors.delete(id);
        }
      }
    }


    if (supervisorCount === 0) {
    }
  }
    function notifySupervisorsOfbreakCounsellor(counsellorId, counsellorName) {

    let supervisorCount = 0;
    let notifiedCount = 0;

    for (const [id, userData] of connectedCounsellors.entries()) {
      if (userData.role === 'Supervisor' || userData.role === 'supervisor') {
        supervisorCount++;
      

        if (supervisorSocket) {
          try {
            const notificationData = {
              type: 'counsellor_idle',
              message: `${counsellorName} has taken break`,
              counsellorId,
              counsellorName,
              timestamp: new Date().toISOString(),
            };


            supervisorSocket.emit('idle_notification', notificationData);
            notifiedCount++;

          } catch (error) {
          }
        } else {
          connectedCounsellors.delete(id);
        }
      }
    }


    if (supervisorCount === 0) {
    }
  }
}

