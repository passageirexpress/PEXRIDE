const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('Testing API endpoints...');

  try {
    // 1. Health Check
    const health = await fetch(`${API_URL}/health`).then(r => r.json());
    console.log('Health Check:', health.status === 'ok' ? 'PASS' : 'FAIL');

    // 2. Create User
    const user = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: 'test_user_123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'passenger'
      })
    }).then(r => r.json());
    console.log('Create User:', user.uid === 'test_user_123' ? 'PASS' : 'FAIL');

    // 3. Create Ride
    const ride = await fetch(`${API_URL}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerId: 'test_user_123',
        pickupLocation: 'Point A',
        dropoffLocation: 'Point B',
        rideType: 'Business',
        vehicleName: 'Mercedes S-Class',
        price: 50
      })
    }).then(r => r.json());
    console.log('Create Ride:', ride.status === 'requested' ? 'PASS' : 'FAIL');

    // 4. Update Ride Status
    const updatedRide = await fetch(`${API_URL}/rides/${ride.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', driverId: 'driver_456' })
    }).then(r => r.json());
    console.log('Update Ride:', updatedRide.status === 'assigned' ? 'PASS' : 'FAIL');

    // 5. Update Driver Location
    const location = await fetch(`${API_URL}/driver-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: 'driver_456',
        driverName: 'John Driver',
        lat: 38.7223,
        lng: -9.1393,
        status: 'available'
      })
    }).then(r => r.json());
    console.log('Update Driver Location:', location.driver_id === 'driver_456' ? 'PASS' : 'FAIL');

    // 6. Get Driver History
    const history = await fetch(`${API_URL}/driver-locations/driver_456/history`).then(r => r.json());
    console.log('Get Driver History:', history.length > 0 ? 'PASS' : 'FAIL');

    // 7. Send Chat Message
    const message = await fetch(`${API_URL}/chats/test_chat_789/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'test_user_123',
        senderName: 'Test User',
        text: 'Hello support!'
      })
    }).then(r => r.json());
    console.log('Send Chat Message:', message.text === 'Hello support!' ? 'PASS' : 'FAIL');

    // 8. Mark Chat as Read
    const read = await fetch(`${API_URL}/chats/test_chat_789/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'support_admin' })
    }).then(r => r.json());
    console.log('Mark Chat Read:', read.success ? 'PASS' : 'FAIL');

    console.log('All API tests completed successfully.');
  } catch (err) {
    console.error('API testing failed:', err.message);
    process.exit(1);
  }
}

testAPI();
