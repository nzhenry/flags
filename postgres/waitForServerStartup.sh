echo "Wating for DB server to come online"
until docker exec $1 psql -U postgres -c "select now()" &> /dev/null
do
  sleep 1
done
sleep 2
echo "DB server is online"