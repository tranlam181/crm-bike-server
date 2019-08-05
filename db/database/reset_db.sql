delete from bao_duong;
delete from bao_duong_chi_phi;
delete from goi_ra;
delete from khach_hang;
delete from khach_hang_xe;
delete from lich_hen;
update SQLITE_SEQUENCE SET seq = 0 where name not like 'dm%';
