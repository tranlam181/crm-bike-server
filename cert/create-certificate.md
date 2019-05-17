#Tao key cho https co 3 buoc dung lenh openssl
1. Tao key file voi:
openssl genrsa -out <private key filename> <length of key>

ex:
openssl genrsa -out ./cert/my-private-public-key.pem 4096

--> file sinh ra la khoa rieng cua he thong su dung de ma hoa
--> trong khoa rieng nay chua: private_key + public_key theo RSA

2. Tao mot request certificate chua thong tin ca nhan cua he thong
openssl req -new -key <private key filename> -out <certificate request filename>

ex:
openssl req -new -key ./cert/privatekey.pem -out ./cert/my-com-req-cert.csr

--> sinh ra mot file yeu cau xac nhan to chuc, thiet bi, theo key
--> thong tin cua file chua thong tin cua to chuc + public key 
--> ma hoa boi private key chi giai ma bang public key kem theo trong file nay

3. Sau khi co file request certificate se gui den trung tam xac nhan trung gian de ho tao cho ta file xac nhan. 
Trung tâm đó sẽ dùng bộ khóa RSA chứa private_key và public_key của họ để ký nhận đưa ra thông tin file chữ ký: my-certificate.pem

File chữ ký đó: Chứa thông tin của public_key của ta, public key của đơn vị xác nhận uy tín, thông tin của đơn vị đã khai ở bước 2.
Do tự xác nhận trên máy nên ta dùng luôn công cụ để tạo ra file certificate. 
Lệnh:
To generate a temporary certificate which is good for 365 days, issue the following command:
openssl x509 -req -days <so luong ngay> -in <file yeu cau buoc 2> -signkey <file private key cua to chuc (midle_key.perm) xac nhan OR self buoc 1> -out <ten file certificate da gan ma chung thuc>
ex:
openssl x509 -req -days 365 -in ./cert/my-com-req-cert.csr -signkey ./cert/my-private-public-key.pem -out ./cert/my-certificate.pem

#Mẫu để tạo
openssl genrsa -out ./cert/my-private-public-key.pem 4096
openssl req -new -key ./cert/privatekey.pem -out ./cert/my-com-req-cert.csr
openssl x509 -req -days 365 -in ./cert/my-com-req-cert.csr -signkey ./cert/my-private-public-key.pem -out ./cert/my-certificate.pem
