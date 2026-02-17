import sys
import struct

def set_gui_subsystem(filepath):
    with open(filepath, 'rb') as f:
        data = bytearray(f.read())

    # Find PE signature offset (at offset 0x3C)
    pe_offset = struct.unpack('<I', data[0x3C:0x40])[0]

    # Verify PE signature
    if data[pe_offset:pe_offset+4] != b'PE\x00\x00':
        print("Not a valid PE file")
        return False

    # PE32+ (64-bit) check
    machine = struct.unpack('<H', data[pe_offset+4:pe_offset+6])[0]
    if machine != 0x8664:  # IMAGE_FILE_MACHINE_AMD64
        print("Not a 64-bit PE file")
        return False

    # Subsystem offset: PE signature + 0x5C for PE32+
    subsystem_offset = pe_offset + 0x5C

    current_subsystem = struct.unpack('<H', data[subsystem_offset:subsystem_offset+2])[0]
    print(f"Current subsystem: {current_subsystem} ({'Console' if current_subsystem == 3 else 'GUI' if current_subsystem == 2 else 'Other'})")

    # Set to GUI (2)
    data[subsystem_offset:subsystem_offset+2] = struct.pack('<H', 2)

    with open(filepath, 'wb') as f:
        f.write(data)

    print(f"Changed subsystem to GUI (2)")
    return True

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python fix-subsystem.py <exe_file>")
        sys.exit(1)

    set_gui_subsystem(sys.argv[1])
