exports.Spinner = function() {
    this.cnt = 0;
    this.interval = null;

    this.spin = function() {
        process.stdout.cursorTo(0);
        switch (this.cnt) {
            case 0:
                process.stdout.write('  /  ');
                break;
            case 1:
                process.stdout.write('  -  ');
                break;
            case 2:
                process.stdout.write("  \\  ");
                break;
            case 3:
                process.stdout.write('  |  ');
                break;
        }
        this.cnt++;
        this.cnt = (this.cnt > 3) ? 0 : this.cnt;
    };

    this.start = function() {
        this.spin();
        this.interval = setInterval(this.spin, 50);
    };

    this.stop = function(){
        if (this.interval) {
            clearInterval(this.interval);
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    };
}
