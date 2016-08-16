<?php
error_reporting(E_ALL);
ini_set('display_errors', true);

$url = $_GET['uniqueURL'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$headers = array();
$headers[] = 'x-auth-token: 2bb98b8c94b04d1593eb4cae11bc993f';

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$server_output = curl_exec ($ch);

curl_close ($ch);

echo  $server_output ;

?>

